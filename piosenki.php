<!doctype html>
<html lang="en">
  <head>
    <title>Archiwum KP - Piosenki</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="style1.css">
  </head>
  <body>
      <?php
        include("nav.php");
      ?>
      <?php
        
      ?>

      <section>
      <div id="tabela">
        <?php
        include("conn.php");
        $query = "SELECT COUNT(id) FROM piosenki";
        $result = mysqli_query($conn,$query);
        foreach($result as $row)
        {
           $max = $row["COUNT(id)"];
        }
        $rand = rand(1,intval($max));

        $query = "SELECT utwor FROM piosenki WHERE id=$rand";
        $result = mysqli_query($conn,$query);

        echo '<table><th colspan="2">Wylosowany utwór</th>';
        foreach($result as $row)
        {
      ?>
           <tr>
           <td class="yt"><a href="https://www.youtube.com/results?search_query=<?php echo $row['utwor']; ?>" target="_blank"><img src="img/yt.png"></a></td>
           <td><?php echo $row["utwor"]; ?></td>
           </tr>
      <?php
        }
        echo "</table><br>";
      ?>
      <?php

          $query = "SELECT id,utwor FROM piosenki ORDER BY utwor ASC";
          $result = mysqli_query($conn,$query);
          $query2 = "SELECT idedycji, idpiosenki FROM piosenkaudzial";
          $result2 = mysqli_query($conn,$query2);
       
          echo '<table><th colspan="2">Utwór</th><th>Edycje</th>';
          foreach($result as $row)
          {
        ?>
             <tr>
             <td class="yt"><a href="https://www.youtube.com/results?search_query=<?php echo $row['utwor']; ?>" target="_blank"><img src="img/yt.png"></a></td>
             <td><?php echo $row["utwor"]; ?></td>
            <?php
              echo '<td style="text-align:center;">';
              foreach($result2 as $row2)
              {
                if($row2['idpiosenki']==$row['id'])
                {
                  echo '<a href="edycje_szczegoly.php?id=' . $row2['idedycji'] . '">' . $row2['idedycji'] . '</a> ';
                }
              }
              echo "</td>";
            ?>
             </tr>
        <?php
          }
          echo "</table>";
        ?>
      </div>
      </section>
      
      <?php
         include("footer.php");
      ?>

      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
      <script src="js/bootstrap.min.js"></script>
  </body>
</html>